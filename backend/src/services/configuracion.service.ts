import {
  ConfiguracionGeneralEntity,
  ConfiguracionInicialEntity,
  type MaquinaConfiguracionInicial,
} from "../domain/entities/index.js";
import {
  UpdateConfiguracionGeneralDto,
  UpdateConfiguracionMaquinaDto,
} from "../domain/dtos/configuracion/index.js";
import { ConfiguracionGeneralRepository } from "../repositories/configuracion-general.repository.js";

export class ConfiguracionGeneralService {
  constructor(
    private readonly configuracionGeneralRepository: ConfiguracionGeneralRepository = new ConfiguracionGeneralRepository(),
  ) {}

  async get(): Promise<ConfiguracionGeneralEntity> {
    return this.configuracionGeneralRepository.getConfiguracionGeneral();
  }

  async getInicial(): Promise<ConfiguracionInicialEntity> {
    return this.configuracionGeneralRepository.getConfiguracionInicial();
  }

  async updateGeneral(
    dto: UpdateConfiguracionGeneralDto,
  ): Promise<ConfiguracionGeneralEntity> {
    return this.configuracionGeneralRepository.updateConfiguracionGeneral(dto);
  }

  async updateMaquina(
    dto: UpdateConfiguracionMaquinaDto,
  ): Promise<MaquinaConfiguracionInicial> {
    return this.configuracionGeneralRepository.updateConfiguracionMaquina(
      dto.tecnologia,
      dto,
    );
  }
}
