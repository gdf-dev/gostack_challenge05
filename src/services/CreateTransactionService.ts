// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (value > balance.total) {
        throw new AppError('Insuficient funds for this transaction', 400);
      }
    }

    const categoriesRepository = getRepository(Category);
    const findCategory_id = await categoriesRepository.findOne({
      where: { title: category },
    });
    let category_id = null;

    if (!findCategory_id) {
      const categoryNew = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(categoryNew);
      category_id = categoryNew.id;
    } else {
      category_id = findCategory_id.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
