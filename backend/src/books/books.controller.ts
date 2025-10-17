import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create book' })
  @ApiResponse({ status: 201, description: 'Book created successfully', type: Book })
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `book-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Si no hay archivo o es undefined, permitir (no es un error)
      if (!file) {
        return callback(null, true);
      }
      // Solo validar si hay un archivo real
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('Solo se permiten archivos de imagen!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() createBookDto: {
      title: string;
      isbn?: string;
      price: number;
      stockQuantity: number;
      isAvailable?: boolean;
      publicationDate?: Date;
      pages?: number;
      description?: string;
      imageUrl?: string;
      authorId?: string;
      publisherId?: string;
      genreId?: string;
    },
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Book> {
    console.log('Create book request:', createBookDto);
    console.log('Uploaded file:', image);
    
    // Validar campos obligatorios
    if (!createBookDto.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }
    
    // Validar precio (obligatorio y debe ser mayor que 0)
    const price = parseFloat(createBookDto.price?.toString() || '0');
    if (isNaN(price) || price <= 0) {
      throw new BadRequestException('El precio es requerido y debe ser mayor que 0');
    }
    
    // Validar cantidad en stock (obligatorio y debe ser mayor o igual a 0)
    const stockQuantity = parseInt(createBookDto.stockQuantity?.toString() || '0');
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      throw new BadRequestException('La cantidad en stock es requerida y debe ser mayor o igual a 0');
    }
    
    const bookData = {
      ...createBookDto,
      price,
      stockQuantity,
      // Solo asignar imageUrl si hay una imagen subida O una URL válida
      imageUrl: image ? `/uploads/${image.filename}` : 
                (createBookDto.imageUrl?.trim() ? createBookDto.imageUrl.trim() : undefined),
    };
    
    console.log('Final book data:', bookData);
    
    return this.booksService.create(bookData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return paginated books' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @Query('title') title?: string,
    @Query('authorId') authorId?: string,
    @Query('publisherId') publisherId?: string,
    @Query('genreId') genreId?: string,
    @Query('isAvailable') isAvailable?: string,
  ): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const filters: {
      title?: string;
      authorId?: string;
      publisherId?: string;
      genreId?: string;
      isAvailable?: string;
    } = {
      title,
      authorId,
      publisherId,
      genreId,
      isAvailable,
    };

    // Remove undefined values from filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await this.booksService.findAll(pageNum, limitNum, filters, sortBy, sortOrder);
    
    return {
      ...result,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiResponse({ status: 200, description: 'Return book by ID', type: Book })
  async findOne(@Param('id') id: string): Promise<Book | null> {
    return this.booksService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update book' })
  @ApiResponse({ status: 200, description: 'Book updated successfully', type: Book })
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `book-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Si no hay archivo o es undefined, permitir (no es un error)
      if (!file) {
        return callback(null, true);
      }
      // Solo validar si hay un archivo real
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('Solo se permiten archivos de imagen!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: Partial<Book> & { imageUrl?: string },
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Book | null> {
    console.log('Update book request for ID:', id);
    console.log('Update data:', updateBookDto);
    console.log('Uploaded file:', image);
    
    const bookData: Partial<Book> = {
      ...updateBookDto,
    };
    
    // Validar precio si se está actualizando (debe ser mayor que 0)
    if (updateBookDto.price !== undefined) {
      const price = parseFloat(updateBookDto.price?.toString() || '0');
      if (isNaN(price) || price <= 0) {
        throw new BadRequestException('El precio debe ser mayor que 0');
      }
      bookData.price = price;
    }
    
    // Validar cantidad en stock si se está actualizando (debe ser mayor o igual a 0)
    if (updateBookDto.stockQuantity !== undefined) {
      const stockQuantity = parseInt(updateBookDto.stockQuantity?.toString() || '0');
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        throw new BadRequestException('La cantidad en stock debe ser mayor o igual a 0');
      }
      bookData.stockQuantity = stockQuantity;
    }
    
    // Validar título si se está actualizando
    if (updateBookDto.title !== undefined && !updateBookDto.title?.trim()) {
      throw new BadRequestException('El título no puede estar vacío');
    }
    
    // Manejar imagen: archivo subido tiene prioridad sobre URL
    if (image) {
      bookData.imageUrl = `/uploads/${image.filename}`;
      console.log('File uploaded, setting imageUrl to:', bookData.imageUrl);
    } else if (updateBookDto.imageUrl !== undefined) {
      // Si se envía imageUrl (incluso vacía), actualizarla
      bookData.imageUrl = updateBookDto.imageUrl?.trim() || null;
      console.log('Using provided imageUrl:', bookData.imageUrl);
    }
    // Si no hay imagen ni URL, no modificar el campo imageUrl existente
    
    console.log('Final update data:', bookData);
    
    return this.booksService.update(id, bookData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete book (soft delete)' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    console.log('Delete book request for ID:', id);
    
    const book = await this.booksService.findById(id);
    if (!book) {
      throw new BadRequestException('Libro no encontrado');
    }
    
    const result = await this.booksService.remove(id);
    
    if (result) {
      console.log('Book deleted successfully:', id);
      return { message: 'Libro eliminado exitosamente' };
    } else {
      throw new BadRequestException('Error al eliminar el libro');
    }
  }
}