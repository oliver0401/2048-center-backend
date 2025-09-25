import { NotFoundError } from "errors";
import { ThemeEntity, UserEntity, UserThemeEntity } from "../entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";
import { MESSAGE } from "consts";
import { ThemeVisibility } from "../types";
import jwt from "jsonwebtoken";
import { userService } from "services";

export const getPublicThemes = async (
  visibility: Exclude<ThemeVisibility, "all">
): Promise<ThemeEntity[]> => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const themes = await themeRepository.find({
    where: { visibility },
  });
  return themes;
};

export const getThemes = async (
  userUuid: string,
  address: string,
  visibility: ThemeVisibility
): Promise<ThemeEntity[]> => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const userThemeRepository: Repository<UserThemeEntity> =
    AppDataSource.getRepository(UserThemeEntity);

  let privateThemes: ThemeEntity[];
  let premiumThemes: ThemeEntity[];
  let publicThemes: ThemeEntity[];
  
  if (visibility === ThemeVisibility.ALL) {
    // If visibility is ALL, get all themes but later filter for owned ones
    // Get private and premium themes owned by the user
    // Query all themes at once with more efficient filtering
    const allThemes = await themeRepository
      .createQueryBuilder("theme")
      .leftJoinAndSelect("theme.userThemes", "userTheme")
      .leftJoinAndSelect("userTheme.user", "user")
      .where("(theme.visibility = :private AND user.uuid = :userUuid)", {
        private: "private",
        userUuid,
      })
      .orWhere("(theme.visibility = :premium AND user.uuid = :userUuid)", {
        premium: "premium",
        userUuid,
      })
      .orWhere("theme.visibility = :public", { public: "public" })
      .getMany();

    // Sort themes by visibility for consistency with the original code
    privateThemes = allThemes.filter((theme) => theme.visibility === "private");
    premiumThemes = allThemes.filter((theme) => theme.visibility === "premium");
    publicThemes = allThemes.filter((theme) => theme.visibility === "public");
    
    return [...privateThemes, ...premiumThemes, ...publicThemes].map(
      (theme) => ({
        ...theme,
        2: theme[2],
        4: theme[4],
        8: theme[8],
        16: theme[16],
        32: theme[32],
        64: theme[64],
        128: theme[128],
        256: theme[256],
        512: theme[512],
        1024: theme[1024],
        2048: theme[2048],
        4096: theme[4096],
        8192: theme[8192],
        16384: theme[16384],
        32768: theme[32768],
        65536: theme[65536],
        owned: theme.userThemes.some((userTheme) => userTheme.user.uuid === userUuid) || theme.creator_id == address,
      })
    );
  } else {
    // For other visibility types, query by visibility as before
    const themes = await themeRepository.find({
      relations: ["userThemes", "userThemes.user"],
      where: { visibility },
    });
    console.log(themes.map((theme) => theme.price))
    return themes.map((theme) => ({
      ...theme,
      2: theme[2],
      4: theme[4],
      8: theme[8],
      16: theme[16],
      32: theme[32],
      64: theme[64],
      128: theme[128],
      256: theme[256],
      512: theme[512],
      1024: theme[1024],
      2048: theme[2048],
      4096: theme[4096],
      8192: theme[8192],
      16384: theme[16384],
      32768: theme[32768],
      65536: theme[65536],
      owned: theme.userThemes.some((userTheme) => userTheme.user.uuid === userUuid),
    }));
  }
};

export const getCreatedThemes = async (address: string) => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const themes = await themeRepository.find({
    where: { creator_id: address },
    order: {
      createdAt: "DESC",
    },
  });
  return themes;
};

export const buyTheme = async (userUuid: string, themeId: string) => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const userThemeRepository: Repository<UserThemeEntity> =
    AppDataSource.getRepository(UserThemeEntity);

  const theme = await themeRepository.findOne({
    where: { uuid: themeId },
    relations: ["userThemes", "userThemes.user"],
  });

  if (!theme) {
    throw new NotFoundError(MESSAGE.ERROR.THEME_DOES_NOT_EXIST);
  }

  const user = await userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!user) {
    throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
  }

  // Check if user already owns this theme
  const existingUserTheme = await userThemeRepository.findOne({
    where: { userId: userUuid, themeId: themeId },
  });

  if (!existingUserTheme) {
    // Create new user theme relationship
    const newUserTheme = new UserThemeEntity();
    newUserTheme.userId = userUuid;
    newUserTheme.themeId = themeId;
    newUserTheme.maxTile = 0;
    newUserTheme.maxScore = 0;
    
    await userThemeRepository.save(newUserTheme);
  }

  return theme;
};

export const createTheme = async (
  userUuid: string,
  theme: Omit<ThemeEntity, "uuid" | "userThemes" | "createdAt" | "updatedAt">
) => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const userThemeRepository: Repository<UserThemeEntity> =
    AppDataSource.getRepository(UserThemeEntity);

  const user = await userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!user) {
    throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
  }

  const newTheme = new ThemeEntity();
  newTheme.title = theme.title;
  newTheme.description = theme.description;
  newTheme.numberDisplay = theme.numberDisplay;
  newTheme.numberColor = theme.numberColor;
  newTheme.numberSize = theme.numberSize;
  newTheme.position = theme.position;
  newTheme.visibility = theme.visibility;
  newTheme.price = theme.price;
  newTheme[2] = theme[2];
  newTheme[4] = theme[4];
  newTheme[8] = theme[8];
  newTheme[16] = theme[16];
  newTheme[32] = theme[32];
  newTheme[64] = theme[64];
  newTheme[128] = theme[128];
  newTheme[256] = theme[256];
  newTheme[512] = theme[512];
  newTheme[1024] = theme[1024];
  newTheme[2048] = theme[2048];
  newTheme[4096] = theme[4096];
  newTheme[8192] = theme[8192];
  newTheme[16384] = theme[16384];
  newTheme[32768] = theme[32768];
  newTheme[65536] = theme[65536];
  newTheme.creator_id = user.address;

  const savedTheme = await themeRepository.save(newTheme);

  // Create user theme relationship
  const newUserTheme = new UserThemeEntity();
  newUserTheme.userId = userUuid;
  newUserTheme.themeId = savedTheme.uuid;
  newUserTheme.maxTile = 0;
  newUserTheme.maxScore = 0;
  
  await userThemeRepository.save(newUserTheme);

  return savedTheme;
};

export const shareTheme = async (themeId: string, uuid: string) => {
  try {
    const object = {themeId, uuid}
    const shareLinkId = jwt.sign(object, process.env.JWT_SECRET as string, { expiresIn: "7d" });
    return shareLinkId;
  } catch (error) {
    console.log("error", error);
  }
};

export const checkOwnership = async (themeId: string, uuid: string) => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const theme = await themeRepository.findOne({ where: { uuid: themeId } });
  console.log("theme", theme);
  const user = await userService.getOneUser({ uuid });
  console.log("user", user);
  if (theme.creator_id == user.address) {
    return true;
  }
  const ownership = user.userThemes.find((userTheme) => userTheme.themeId == themeId);
  if(ownership) {
    return true;
  }
  return false;
};

export const importTheme = async (themeId: string, uuid: string) => {
  const themeRepository: Repository<ThemeEntity> = AppDataSource.getRepository(ThemeEntity);
  const userThemeRepository: Repository<UserThemeEntity> = AppDataSource.getRepository(UserThemeEntity);
  const user = await userService.getOneUser({ uuid });

  // Find the theme to import
  const theme = await themeRepository.findOne({ where: { uuid: themeId } });
  if (!theme) {
    throw new Error("Theme not found");
  }

  // Check if user already has this theme
  const existingUserTheme = await userThemeRepository.findOne({
    where: { userId: uuid, themeId: themeId }
  });

  if (existingUserTheme) {
    // Already imported
    return theme;
  }

  // Create user-theme relation with themeOwnership = false
  const newUserTheme = new UserThemeEntity();
  newUserTheme.userId = uuid;
  newUserTheme.themeId = themeId;
  newUserTheme.maxTile = 0;
  newUserTheme.maxScore = 0;

  await userThemeRepository.save(newUserTheme);

  return theme;
};