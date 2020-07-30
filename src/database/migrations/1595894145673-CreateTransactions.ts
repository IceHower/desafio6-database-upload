import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class CreateTransactions1595894145673
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 10, // siguinifica que o valor pode ter o numero x de digitos do lado esquerdo
            scale: 2, // siguinifica que o valor pode ter o numero x de digitos do lado direito
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()', // postgree gera essa data
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
  }
}
