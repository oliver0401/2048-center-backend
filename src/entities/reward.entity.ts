import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("reward")
export class RewardEntity extends CoreEntity {
  @Column({ type: "date", nullable: false })
  date: Date;

  @Column({ type: "varchar", nullable: false })
  address: string;

  @Column({ type: "varchar", nullable: false })
  token: string;

  @Column({ type: "varchar", nullable: false })
  network: string;

  @Column({ type: "int", nullable: false })
  amount: number;

  @Column({ type: "int", nullable: false})
  rewardAmount: number

  @Column({ type: "varchar", nullable: false })
  txHash: string;
}
