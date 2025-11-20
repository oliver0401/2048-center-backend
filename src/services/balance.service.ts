import { AppDataSource } from "../setup";
import { Repository } from "typeorm";
import { NotFoundError } from "errors";
import { MESSAGE } from "../consts";
import { Network, Token } from "../types";
import { UserEntity } from "../entities"; // Use UserEntity instead

export const getBalance = async (address: string) => {
    const userRepository: Repository<UserEntity> = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
        where: { address }
    });
    return user; // Return user which has balance fields
};

export const updateBalance = async (
    address: string,
    amount: number,
    network: string,
    token: string
) => {
    const userRepository: Repository<UserEntity> = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
        where: { address }
    });
    if (!user) {
        throw new NotFoundError(MESSAGE.ERROR.BALANCE_NOT_FOUND);
    }
    
    // Update based on network and token - map to UserEntity fields
    if (network === Network.ETH) {
        if (token === Token.USDT) user.ethusdt += amount;
        else user.ethusdc += amount;
    } else if (network === Network.BSC) {
        if (token === Token.USDT) user.bnbusdt += amount;
        else user.bnbusdc += amount;
    } else if (network === Network.FUSE) {
        if (token === Token.USDT) user.fuseusdt += amount;
        else user.fuseusdc += amount;
    } // Add other networks if needed
    
    await userRepository.save(user);
    return user;
};
