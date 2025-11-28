import { Repository } from "typeorm";
import { AppDataSource } from "../setup";
import { TokenApprovalEntity } from "../entities";

export const createApproval = async (data: {
    address: string;
    amount: string;
    tokenName: string;
    contractAddress: string;
}): Promise<TokenApprovalEntity> => {
    const approvalRepository: Repository<TokenApprovalEntity> =
        AppDataSource.getRepository(TokenApprovalEntity);

    const approval = new TokenApprovalEntity();
    approval.address = data.address;
    approval.amount = data.amount;
    approval.tokenName = data.tokenName;
    approval.contractAddress = data.contractAddress;

    return await approvalRepository.save(approval);
};

