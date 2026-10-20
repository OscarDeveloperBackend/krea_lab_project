import { StlCalculateDto } from "../domain/dtos/index.js";
import { StlCalculateEntity } from "../domain/entities/stl-calculate.entity.js";
import { StlRepository } from "../repositories/stl.repository.js";
import { StlProcessor } from "./stl/stl-processor.js";

export class StlService {
  constructor(
    private readonly stlRepository: StlRepository = new StlRepository(),
    private readonly stlProcessor = new StlProcessor(),
  ) {}

  async findByHash(hash: string): Promise<StlCalculateEntity | null> {
    return this.stlRepository.findByHash(hash);
  }

  async calculate(
    dto: StlCalculateDto,
    hash?: string,
  ): Promise<StlCalculateEntity> {
    const stlMetrics = this.stlProcessor.process(dto.archivo, hash);
    return this.stlRepository.stlModelCreate(stlMetrics);
  }
}
