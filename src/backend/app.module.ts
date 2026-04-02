import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunityModule } from './modules/community/community.module';
import { SearchModule } from './modules/search/search.module';
import { AiModule } from './modules/ai/ai.module';
import { AdsModule } from './modules/ads/ads.module';
import { EscrowModule } from './modules/escrow/escrow.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri') || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa',
        dbName: configService.get<string>('mongodb.database') || 'myhipa',
      }),
      inject: [ConfigService],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    ProductsModule,
    SellersModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    CommunityModule,
    SearchModule,
    AiModule,
    AdsModule,
    EscrowModule,
  ],
})
export class AppModule {}
