import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import Balance from '../models/Balance';

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomeSum = transactions.reduce((sum, income) => {
      if (income.type === 'income') {
        return sum + income.value;
      }
      return sum;
    }, 0);

    const outcomeSum = transactions.reduce((sum, outcome) => {
      if (outcome.type === 'outcome') {
        return sum + outcome.value;
      }
      return sum;
    }, 0);

    const total = incomeSum - outcomeSum;

    const balance: Balance = {
      income: incomeSum,
      outcome: outcomeSum,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
