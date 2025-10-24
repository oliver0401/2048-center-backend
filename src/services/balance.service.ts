import { BalanceEntity } from "entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";
import { NotFoundError } from "errors";
import { MESSAGE } from "../consts";
import { Network, Token } from "../types";

export const getBalance = async (address: string) => {
    const balanceRepository: Repository<BalanceEntity> =
        AppDataSource.getRepository(BalanceEntity);
    const balance = await balanceRepository.findOne({
        where: { address }
    });
    return balance;
};

export const updateBalance = async (
    address: string,
    amount: number,
    network: string,
    token: string
) => {
    const balanceRepository: Repository<BalanceEntity> =
        AppDataSource.getRepository(BalanceEntity);
    const balance = await balanceRepository.findOne({
        where: { address }
    });
    if (!balance) {
        throw new NotFoundError(MESSAGE.ERROR.BALANCE_NOT_FOUND);
    }
    if (network === Network.ETH) {
        token === Token.USDT
            ? balance.etbalance += amount
            : balance.ecbalance += amount;
    }
    if (network === Network.BSC) {
        token === Token.USDT
            ? balance.btbalance += amount
            : balance.bcbalance += amount;
    }
    if (network === Network.FUSE) {
        token === Token.USDT
            ? balance.ftbalance += amount
            : balance.fcbalance += amount;
    }
    await balanceRepository.save(balance);
    return balance;
};
