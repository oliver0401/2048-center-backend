import { AppDataSource } from "../setup";
import { Repository } from "typeorm";
import { UserEntity } from "../entities";

type TileCount = {
  count: number;
  rate: number;
};

export const maxTileCount = async (): Promise<TileCount[]> => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);

  // Get count of users per maxTile value in a single query
  const tileValueCounts = await userRepository
    .createQueryBuilder("user")
    .select("user.maxTile", "tileValue")
    .addSelect("COUNT(*)", "count")
    .where("user.maxTile IN (:...values)", {
      values: [2048, 4096, 8192, 16384, 32768, 65536],
    }) // Adjusted to only count relevant tiles
    .groupBy("user.maxTile")
    .getRawMany();

  const members = await userRepository.count();

  // Initialize cumulative count
  let cumulativeCount = 0;

  // Map results to expected format
  const tileCounts: TileCount[] = [65536, 32768, 16384, 8192, 4096, 2048].map(
    (tileValue) => {
      const found = tileValueCounts.find(
        (count) => count.tileValue === tileValue
      );
      const count = found ? parseInt(found.count) : 0;

      // Update cumulative count
      cumulativeCount += count;

      return {
        count: cumulativeCount,
        rate: cumulativeCount / members,
      };
    }
  );

  return tileCounts;
};

export const maxMoveCount = async (uuid: string) => {
  try {
    const userRepository: Repository<UserEntity> =
      AppDataSource.getRepository(UserEntity);

    const moveRanking = await userRepository.find({
      order: {
        maxMoves: "DESC",
      },
      select: { maxMoves: true },
      take: 10,
    });

    // Get user's ranking
    const userRank = await userRepository
      .createQueryBuilder("user")
      .select("COUNT(*)", "rank")
      .where(
        "user.maxMoves > (SELECT max_moves FROM user WHERE uuid = :uuid)",
        {
          uuid,
        }
      )
      .getRawOne();

    return {
      topUsers: moveRanking,
      userRank: Number(userRank?.rank || 0) + 1, // Add 1 since rank is 0-based
    };
  } catch (err) {
    console.error(err);
    return {
      topUsers: [],
      userRank: 0,
    };
  }
};

export const maxScoreCount = async (uuid: string) => {
  try {
    const userRepository: Repository<UserEntity> =
      AppDataSource.getRepository(UserEntity);

    const scoreRanking = await userRepository.find({
      order: {
        maxScore: "DESC",
      },
      select: { maxScore: true },
      take: 10,
    });
    const userRank = await userRepository
      .createQueryBuilder("user")
      .select("COUNT(*)", "rank")
      .where(
        "user.maxScore > (SELECT max_score FROM user WHERE uuid = :uuid)",
        {
          uuid,
        }
      )
      .getRawOne();
    return {
      topUsers: scoreRanking,
      userRank: Number(userRank?.rank || 0) + 1, // Add 1 since rank is 0-based
    };
  } catch (err) {
    console.error(err);
    return {
      topUsers: [],
      userRank: 0,
    };
  }
};
