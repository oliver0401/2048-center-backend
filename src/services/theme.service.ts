import { NotFoundError } from "errors";
import { ThemeEntity, UserEntity } from "../entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";
import { MESSAGE } from "consts";

export const getThemes = async (
  userUuid: string
): Promise<ThemeEntity[]> => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);

  const themes = await themeRepository.find({
    relations: ["users"],
  });

  return themes.map(theme => ({
    ...theme,
    2: JSON.parse(theme[2] || '{}'),
    4: JSON.parse(theme[4] || '{}'),
    8: JSON.parse(theme[8] || '{}'),
    16: JSON.parse(theme[16] || '{}'),
    32: JSON.parse(theme[32] || '{}'),
    64: JSON.parse(theme[64] || '{}'),
    128: JSON.parse(theme[128] || '{}'),
    256: JSON.parse(theme[256] || '{}'),
    512: JSON.parse(theme[512] || '{}'),
    1024: JSON.parse(theme[1024] || '{}'),
    2048: JSON.parse(theme[2048] || '{}'),
    4096: JSON.parse(theme[4096] || '{}'),
    8192: JSON.parse(theme[8192] || '{}'),
    owned: theme.users.some(user => user.uuid === userUuid),
  }));
};

export const buyTheme = async (userUuid: string, themeId: string) => {
  const themeRepository: Repository<ThemeEntity> =
    AppDataSource.getRepository(ThemeEntity);
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);

  const theme = await themeRepository.findOne({
    where: { uuid: themeId },
    relations: ["users"],
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

  if (!theme.users.some(user => user.uuid === userUuid)) {
    theme.users.push(user);
  }

  await themeRepository.save(theme);

  return theme;
};
