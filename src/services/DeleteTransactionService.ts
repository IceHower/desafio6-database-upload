import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    // Como vamos passar o id, nao precisa da clausula where
    const deleteTransaction = await transactionRepository.findOne(id);
    if (!deleteTransaction) {
      throw new AppError('this transaction doesnt exist!');
    }
    // remove a transaction
    await transactionRepository.remove(deleteTransaction);
  }
}

export default DeleteTransactionService;
