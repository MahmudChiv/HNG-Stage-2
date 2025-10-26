// src/models/User.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from "sequelize-typescript";

@Table({
  tableName: "countries",
  timestamps: true,
})
export class Country extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUID,
  })
  declare id?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare capital: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare population: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare currency_code: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare exchange_rate: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare estimated_gdp: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare flag_url: URL;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare last_refreshed_at: Date;
}
