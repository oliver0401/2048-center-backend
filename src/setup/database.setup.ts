import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { UserEntity, ThemeEntity } from "../entities";
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
  synchronize: true,
  entities: [UserEntity, ThemeEntity],
  entitySkipConstructor: true,
  namingStrategy: new SnakeNamingStrategy(),
});
