import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

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
    const categoryRepository = getRepository(Category);
    // Verifica se o tipo é um outcome
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      // Verifica se o balance é menor que o value da transaction
      if (balance.total < value) {
        throw new AppError('Not enought balance to this transaction', 400);
      }
    }
    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });
    // Se ela nao retornar, vamos criar a category recebendo o title. por isso foi usado o let em cima, para poder sobrescrever.
    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      // cria um objeto para ser inserido no banco de dados
      title,
      value,
      type,
      category: transactionCategory, // define a category como transactionCategory
    });

    await transactionsRepository.save(transaction); // Salva o transaction no banco de dados

    return transaction;
  }
}

export default CreateTransactionService;
