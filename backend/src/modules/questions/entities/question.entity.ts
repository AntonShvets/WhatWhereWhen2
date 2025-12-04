import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  viewer_id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  media_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  media_thumbnail_url: string;

  @Column({ type: 'integer', nullable: true })
  difficulty: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approved_at: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  question_status: string; // 'pending', 'used', 'deferred'

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}

