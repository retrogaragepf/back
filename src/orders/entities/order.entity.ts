import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Users } from 'src/users/entities/users.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('ORDERS')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, (user) => user.orders, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PAID,
  })
  status: OrderStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Index({ unique: true })
  @Column({ nullable: true })
  stripeSessionId: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];
}
