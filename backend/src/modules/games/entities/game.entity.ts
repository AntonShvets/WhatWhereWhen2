import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  end_time: Date;

  @Column({ type: 'integer', default: 0 })
  experts_score: number;

  @Column({ type: 'integer', default: 0 })
  viewers_score: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: string;

  @Column({ type: 'integer', default: 0 })
  current_round_number: number;

  @Column({ type: 'integer', default: 13 })
  max_rounds: number;

  @Column({ type: 'date', nullable: true })
  game_date: Date;

  @Column({ type: 'integer', nullable: true })
  season_number: number;

  @Column({ type: 'integer', nullable: true })
  episode_number: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}

