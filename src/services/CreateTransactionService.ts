import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();
      if (value > balance.total) {
        throw new AppError('Insuficient funds!', 400);
      }
    }
    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      const newCategory = await categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(newCategory);
      const transaction = transactionRepository.create({
        title,
        type,
        value,
        category_id: newCategory.id,
      });
      await transactionRepository.save(transaction);
      return transaction;
    }
    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: categoryExists.id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
