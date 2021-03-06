import csvParse from 'csv-parse';
import fs from 'fs'; // importa o filesystem
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const contactsReadStream = fs.createReadStream(filePath); // vai ler os arquivo que esta no filePath
    // definimos que start os valores a partir da linha 2
    const parses = csvParse({
      from_line: 2,
    });
    // O pipe significa que ele vai ler as linhas conforme elas forem disponiveis;
    const parseCSV = contactsReadStream.pipe(parses);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      // O map vai remover todo espaço em branco de cada linha.
      // desestruturamos o title, type, value e o category
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !type || !value) return;
      categories.push(category);

      transactions.push({ title, type, value, category });
    });
    // Fiz uma promise para esperar o metodo on terminar para assim poder ler os valores.
    await new Promise(resolve => parseCSV.on('end', resolve));
    // O metodo In, vai dizer se as categorias estao no banco de dados
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // faz um map para retornar só os titles.
    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );
    // Filtra o array das categorias que nao existe das categorias total
    // O segundo filter, vai verificar se existem nomes duplicados no arquivo csv
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // Cria um objeto no repository de category
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    // Salva as categorias no banco de dados.
    await categoriesRepository.save(newCategories);

    // as finalsCategories vai ser todas as novas e as que ja existiam
    const finalCategories = [...newCategories, ...existentCategories];
    // Cria um objeto no repository de transaction
    const createdTransaction = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    // salva as transactions criadas
    await transactionsRepository.save(createdTransaction);
    // deleta os arquivos que foram uploadados
    await fs.promises.unlink(filePath);
    return createdTransaction;
  }
}

export default ImportTransactionsService;
