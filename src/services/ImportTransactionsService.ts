import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categoriesRepository = getRepository(Category);
    const csvData: CsvTransaction[] = [];
    const dbCategories = await categoriesRepository.find();
    const csvCategories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!dbCategories.some(e => e.title === category)) {
        csvCategories.push(category);
      }

      const transaction = {
        title,
        type,
        value,
        category,
      };

      csvData.push(transaction);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const filteredCategories = Array.from(new Set(csvCategories));
    const newCategories = categoriesRepository.create(
      filteredCategories.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);
    const mergedCategories = [...dbCategories, ...newCategories];

    const transactionRepository = getCustomRepository(TransactionRepository);
    const newTransactions = transactionRepository.create(
      csvData.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: mergedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(newTransactions);

    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
