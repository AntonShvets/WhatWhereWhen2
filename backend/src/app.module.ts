import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from './modules/games/games.module';
import { RoundsModule } from './modules/rounds/rounds.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { ExpertsModule } from './modules/experts/experts.module';
import { ViewersModule } from './modules/viewers/viewers.module';
import { UploadModule } from './modules/upload/upload.module';
import { GameGateway } from './gateways/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || process.env.USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatwherewhen2',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // false in production
      logging: process.env.NODE_ENV === 'development',
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
    GamesModule,
    RoundsModule,
    QuestionsModule,
    ExpertsModule,
    ViewersModule,
    UploadModule,
  ],
  providers: [GameGateway],
})
export class AppModule {}

