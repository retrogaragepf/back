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
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('ORDERS')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PAID,
  })
  status: OrderStatus;

  @Column({ unique: true })
  trackingCode: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  stripeSessionId: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.orders, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
