import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserEntity } from "./user.entity";

@Entity("record")
export class RecordEntity extends CoreEntity {
  @ManyToOne(() => UserEntity, (user) => user.uuid)
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @Column({ type: "timestamp", nullable: false })
  date: Date;

  @Column({ type: "int", nullable: false })
  move: number;

  @Column({ type: "int", nullable: false })
  score: number;

  @Column({ type: "int", nullable: false })
  rows: number;

  @Column({ type: "int", nullable: false })
  cols: number;

  @Column({ type: "int", nullable: false })
  playTime: number; // in seconds

  @Column({ type: "text", nullable: true })
  playHistoryUrl: string; // S3 URL for play history
}
