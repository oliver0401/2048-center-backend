import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("subscribe")
export class SubscribeEntity extends CoreEntity {
  @Column({ type: "varchar", nullable: false, unique: true })
  email: string;
}
