import { Webinar } from '../entities/webinar.entity';
import { IWebinarRepository } from '../ports/webinar-repository.interface';

export class InMemoryWebinarRepository implements IWebinarRepository {
  constructor(public database: Webinar[] = []) {}

  async create(webinar: Webinar): Promise<void> {
    this.database.push(webinar);
  }

  async findById(id: string): Promise<Webinar | null> {
    const webinar = this.database.find((w) => w.props.id === id);
    return webinar || null;
  }

  async update(webinar: Webinar): Promise<void> {
    const index = this.database.findIndex(
      (w) => w.props.id === webinar.props.id,
    );
    if (index !== -1) {
      this.database[index] = webinar;
    }
  }
}
