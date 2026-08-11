import { VariantRepository } from '../repositories/variant.repository';
import { ProductVariantDto, CreateProductVariantDto, UpdateProductVariantDto } from '@galaxy/types';

export class VariantService {
  private variantRepository: VariantRepository;

  constructor() {
    this.variantRepository = new VariantRepository();
  }

  async getVariantsByProduct(productId: string): Promise<ProductVariantDto[]> {
    return this.variantRepository.findByProductId(productId);
  }

  async getVariantById(id: string): Promise<ProductVariantDto | null> {
    return this.variantRepository.findById(id);
  }

  async getVariantBySku(sku: string): Promise<ProductVariantDto | null> {
    return this.variantRepository.findBySku(sku);
  }

  async createVariant(productId: string, payload: CreateProductVariantDto): Promise<ProductVariantDto> {
    return this.variantRepository.create({
      ...payload,
      product_id: productId
    });
  }

  async updateVariant(id: string, payload: UpdateProductVariantDto): Promise<ProductVariantDto> {
    return this.variantRepository.update(id, payload);
  }

  async deleteVariant(id: string): Promise<boolean> {
    return this.variantRepository.delete(id);
  }
}
