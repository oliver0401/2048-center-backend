import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import {
  UserEntity,
  ThemeEntity,
  UserThemeEntity,
  RecordEntity,
  RewardEntity,
  MonitorEntity,
  SubscribeEntity,
  PriceEntity,
  TokenApprovalEntity,
  SigninEntity,
  EventEntity,
} from "../entities";
import "dotenv/config";
import { Env } from "../env";

export const AppDataSource = new DataSource({
  type: "mysql",
  database: Env.dbName,
  host: Env.host,
  username: Env.username,
  password: Env.password,
  port: Env.dbPort,
  logging: false,
  synchronize: true, // Temporarily disabled to avoid migration conflicts
  entities: [
    UserEntity,
    ThemeEntity,
    UserThemeEntity,
    RecordEntity,
    RewardEntity,
    MonitorEntity,
    SubscribeEntity,
    PriceEntity,
    TokenApprovalEntity,
    SigninEntity,
    EventEntity,
  ],
  entitySkipConstructor: true,
  namingStrategy: new SnakeNamingStrategy(),
});
