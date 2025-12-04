import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  game_id: string;

  @Column({ type: 'uuid', nullable: true })
  question_id: string;

  @Column({ type: 'integer' })
  round_number: number;

  @Column({ type: 'boolean', default: false })
  is_answered_correctly: boolean;

  @Column({ type: 'text', nullable: true })
  experts_answer: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  time_started: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  time_answered: Date;

  @Column({ type: 'integer', default: 60 })
  time_limit_seconds: number;

  @Column({ type: 'jsonb', default: {} })
  display_status: any;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}

