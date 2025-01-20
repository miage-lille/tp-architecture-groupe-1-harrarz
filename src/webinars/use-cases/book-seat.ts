import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { Participation } from 'src/webinars/entities/participation.entity';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

type Request = {
  webinarId: string;
  user: User;
};

type Response = void;

export class NoSeatsAvailableException extends Error {
  constructor() {
    super('No seats available for this webinar');
  }
}

export class AlreadyParticipatingException extends Error {
  constructor() {
    super('User is already participating in this webinar');
  }
}

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute({ webinarId, user }: Request): Promise<Response> {
    // Check if webinar exists
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    // Get current participations
    const participations =
      await this.participationRepository.findByWebinarId(webinarId);

    // Check if user is already participating
    const isAlreadyParticipating = participations.some(
      (p) => p.props.userId === user.props.id,
    );
    if (isAlreadyParticipating) {
      throw new AlreadyParticipatingException();
    }

    // Check available seats
    if (participations.length >= webinar.props.seats) {
      throw new NoSeatsAvailableException();
    }

    // Create participation
    const participation = new Participation({
      userId: user.props.id,
      webinarId,
    });

    await this.participationRepository.save(participation);

    // Send email to organizer
    const organizer = await this.userRepository.findById(
      webinar.props.organizerId,
    );
    if (organizer) {
      const remainingSeats = webinar.props.seats - participations.length - 1;
      await this.mailer.send({
        to: organizer.props.email,
        subject: `New participant in your webinar: ${webinar.props.title}`,
        body: `A new participant has registered for your webinar "${webinar.props.title}". There are now ${remainingSeats} seats remaining.`,
      });
    }
  }
}
