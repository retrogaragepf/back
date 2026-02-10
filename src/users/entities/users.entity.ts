import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'USERS' })
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  email: string;

  @Column({
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  password: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  provider?: 'local' | 'google';

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  providerId?: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
