import { Entity, Column, OneToMany } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserThemeEntity } from "./userTheme.entity";

@Entity("user")
export class UserEntity extends CoreEntity {
  @Column({ type: "boolean", default: false })
  onboarded: boolean;

  @Column({ type: "varchar", nullable: false })
  address: string;

  @Column({ type: "int", nullable: true, default: 0 })
  maxScore: number;

  @Column({ type: "int", nullable: true, default: 0 })
  maxTile: number;

  @Column({ type: "int", nullable: true, default: 0 })
  maxMoves: number;

  @Column({ type: "int", nullable: false, default: 4 })
  rows: number;

  @Column({ type: "int", nullable: false, default: 4 })
  cols: number;

  @OneToMany(() => UserThemeEntity, (userTheme) => userTheme.user)
  userThemes: UserThemeEntity[];

  @Column({ type: "int", nullable: false, default: 0 })
  hammer: number;

  @Column({ type: "int", nullable: false, default: 0 })
  upgrade: number;

  @Column({ type: "int", nullable: false, default: 0 })
  powerup: number;

  @Column({ type: "varchar", nullable: false, default: 0 })
  os: string;

  @Column({ type: "float", nullable: false, default: 0 })
  ethusdt: number;

  @Column({ type: "float", nullable: false, default: 0 })
  ethusdc: number;

  @Column({ type: "float", nullable: false, default: 0 })
  bnbusdt: number;

  @Column({ type: "float", nullable: false, default: 0 })
  bnbusdc: number;

  @Column({ type: "float", nullable: false, default: 0 })
  polusdt: number;

  @Column({ type: "float", nullable: false, default: 0 })
  polusdc: number;

  @Column({ type: "float", nullable: false, default: 0 })
  fuseusdt: number;

  @Column({ type: "float", nullable: false, default: 0 })
  fuseusdc: number;
}
