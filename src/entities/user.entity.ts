import { Entity, Column, ManyToMany } from "typeorm";
import { CoreEntity } from "./core.entity";
import { ThemeEntity } from "./theme.entity";

@Entity("user")
export class UserEntity extends CoreEntity {
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

  @ManyToMany(() => ThemeEntity, theme => theme.users)
  themes: ThemeEntity[];

  @Column({ type: "int", nullable: false, default: 0 })
  hammer: number;

  @Column({ type: "int", nullable: false, default: 0 })
  upgrade: number;

  @Column({ type: "int", nullable: false, default: 0 })
  powerup: number;
}
