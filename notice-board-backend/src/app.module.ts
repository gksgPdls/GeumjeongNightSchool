import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NoticeBoardModule } from './module/notice-board.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeBoardPost } from './entity/notice-board-post.entity';
import { Comment } from './entity/comment.entity';
import { User } from './entity/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommentModule } from './module/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(
          configService.get<string>('DATABASE_PORT') ?? '5432',
          10,
        ),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [NoticeBoardPost, Comment, User],
        synchronize: process.env.NODE_ENV !== 'production',
        dropSchema: false,
      }),
    }),
    NoticeBoardModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
