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
  ],
  entitySkipConstructor: true,
  namingStrategy: new SnakeNamingStrategy(),
});
