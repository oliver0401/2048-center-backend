import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserEntity } from "./user.entity";

@Entity("theme")
export class ThemeEntity extends CoreEntity {
  @Column({ type: "varchar", nullable: true })
  title: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  2: string;

  @Column({ type: "text", nullable: true })
  4: string;

  @Column({ type: "text", nullable: true })
  8: string;

  @Column({ type: "text", nullable: true })
  16: string;
  
  @Column({ type: "text", nullable: true })
  32: string;

  @Column({ type: "text", nullable: true })
  64: string;
  
  @Column({ type: "text", nullable: true })
  128: string;

  @Column({ type: "text", nullable: true })
  256: string;
  
  @Column({ type: "text", nullable: true })
  512: string;

  @Column({ type: "text", nullable: true })
  1024: string;
  
  @Column({ type: "text", nullable: true })
  2048: string;

  @Column({ type: "text", nullable: true })
  4096: string;

  @Column({ type: "text", nullable: true })
  8192: string;

  @ManyToMany(() => UserEntity, user => user.themes)
  @JoinTable({
    name: "user_themes", // name of the join table
    joinColumn: {
      name: "theme_id",
      referencedColumnName: "uuid"
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "uuid"
    }
  })
  users: UserEntity[];
}
