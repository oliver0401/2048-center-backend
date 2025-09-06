import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ThemeEntity } from "./theme.entity";
import { CoreEntity } from "./core.entity";

@Entity("user_themes")
export class UserThemeEntity extends CoreEntity {
  @Column({ type: "int", nullable: true, default: 0 })
  maxTile: number;

  @Column({ type: "int", nullable: true, default: 0 })
  maxScore: number;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "theme_id" })
  themeId: string;

  @ManyToOne(() => UserEntity, (user) => user.userThemes)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @ManyToOne(() => ThemeEntity, (theme) => theme.userThemes)
  @JoinColumn({ name: "theme_id" })
  theme: ThemeEntity;
} 