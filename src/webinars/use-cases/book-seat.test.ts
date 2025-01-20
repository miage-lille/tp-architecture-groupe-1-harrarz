import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { User } from 'src/users/entities/user.entity';
import {
  BookSeat,
  NoSeatsAvailableException,
  AlreadyParticipatingException,
} from './book-seat';
import { IParticipationRepository } from '../ports/participation-repository.interface';
import { Participation } from '../entities/participation.entity';

class InMemoryUserRepository implements IUserRepository {
  constructor(private users: User[] = []) {}

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.props.id === id) || null;
  }
}

class InMemoryParticipationRepository implements IParticipationRepository {
  private participations: Participation[] = [];

  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    return this.participations.filter((p) => p.props.webinarId === webinarId);
  }

  async save(participation: Participation): Promise<void> {
    this.participations.push(participation);
  }
}

describe('Feature: Book a seat in a webinar', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let participationRepository: InMemoryParticipationRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let useCase: BookSeat;

  const user = new User({
    id: 'user-1',
    email: 'user@test.com',
    password: 'password123',
  });

  const organizer = new User({
    id: 'organizer-id',
    email: 'organizer@test.com',
    password: 'password123',
  });

  const webinar = new Webinar({
    id: 'webinar-1',
    organizerId: organizer.props.id,
    title: 'Test Webinar',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-01'),
    seats: 2,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository();
    participationRepository = new InMemoryParticipationRepository();
    userRepository = new InMemoryUserRepository([organizer]);
    mailer = new InMemoryMailer();
    useCase = new BookSeat(
      participationRepository,
      userRepository,
      webinarRepository,
      mailer,
    );
  });

  describe('Scenario: Happy path - booking a seat', () => {
    beforeEach(async () => {
      await webinarRepository.create(webinar);
    });

    it('should successfully book a seat', async () => {
      await expect(
        useCase.execute({
          user,
          webinarId: webinar.props.id,
        }),
      ).resolves.not.toThrow();
    });

    it('should create a participation record', async () => {
      await useCase.execute({
        user,
        webinarId: webinar.props.id,
      });

      const participations = await participationRepository.findByWebinarId(
        webinar.props.id,
      );
      expect(participations).toHaveLength(1);
      expect(participations[0].props).toEqual({
        userId: user.props.id,
        webinarId: webinar.props.id,
      });
    });

    it('should send an email to the organizer', async () => {
      await useCase.execute({
        user,
        webinarId: webinar.props.id,
      });

      expect(mailer.sentEmails).toHaveLength(1);
      expect(mailer.sentEmails[0].to).toBe(organizer.props.email);
      expect(mailer.sentEmails[0].subject).toBe(
        'New participant in your webinar: Test Webinar',
      );
    });

    it('should send correct remaining seats count in email', async () => {
      await useCase.execute({
        user,
        webinarId: webinar.props.id,
      });

      expect(mailer.sentEmails[0].body).toBe(
        'A new participant has registered for your webinar "Test Webinar". There are now 1 seats remaining.',
      );
    });
  });

  describe('Scenario: No seats available', () => {
    beforeEach(async () => {
      await webinarRepository.create(webinar);
      await participationRepository.save(
        new Participation({
          userId: 'existing-user-1',
          webinarId: webinar.props.id,
        }),
      );
      await participationRepository.save(
        new Participation({
          userId: 'existing-user-2',
          webinarId: webinar.props.id,
        }),
      );
    });

    it('should throw NoSeatsAvailableException', async () => {
      await expect(
        useCase.execute({
          user,
          webinarId: webinar.props.id,
        }),
      ).rejects.toThrow(NoSeatsAvailableException);
    });

    it('should not create a participation record when no seats available', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: webinar.props.id,
        });
      } catch (error) {}

      const participations = await participationRepository.findByWebinarId(
        webinar.props.id,
      );
      expect(participations).toHaveLength(2);
    });

    it('should not send an email when no seats available', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: webinar.props.id,
        });
      } catch (error) {}

      expect(mailer.sentEmails).toHaveLength(0);
    });
  });

  describe('Scenario: User already participating', () => {
    beforeEach(async () => {
      await webinarRepository.create(webinar);
      await participationRepository.save(
        new Participation({
          userId: user.props.id,
          webinarId: webinar.props.id,
        }),
      );
    });

    it('should throw AlreadyParticipatingException', async () => {
      await expect(
        useCase.execute({
          user,
          webinarId: webinar.props.id,
        }),
      ).rejects.toThrow(AlreadyParticipatingException);
    });

    it('should not create another participation record', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: webinar.props.id,
        });
      } catch (error) {}

      const participations = await participationRepository.findByWebinarId(
        webinar.props.id,
      );
      expect(participations).toHaveLength(1);
    });

    it('should not send an email when already participating', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: webinar.props.id,
        });
      } catch (error) {}

      expect(mailer.sentEmails).toHaveLength(0);
    });
  });

  describe('Scenario: Webinar not found', () => {
    it('should throw an error when webinar does not exist', async () => {
      await expect(
        useCase.execute({
          user,
          webinarId: 'non-existent-id',
        }),
      ).rejects.toThrow('Webinar not found');
    });

    it('should not create a participation record for non-existent webinar', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: 'non-existent-id',
        });
      } catch (error) {}

      const participations =
        await participationRepository.findByWebinarId('non-existent-id');
      expect(participations).toHaveLength(0);
    });

    it('should not send an email for non-existent webinar', async () => {
      try {
        await useCase.execute({
          user,
          webinarId: 'non-existent-id',
        });
      } catch (error) {}

      expect(mailer.sentEmails).toHaveLength(0);
    });
  });

  describe('Scenario: Organizer not found', () => {
    beforeEach(async () => {
      userRepository = new InMemoryUserRepository([]);
      useCase = new BookSeat(
        participationRepository,
        userRepository,
        webinarRepository,
        mailer,
      );
      await webinarRepository.create(webinar);
    });

    it('should still create participation when organizer not found', async () => {
      await useCase.execute({
        user,
        webinarId: webinar.props.id,
      });

      const participations = await participationRepository.findByWebinarId(
        webinar.props.id,
      );
      expect(participations).toHaveLength(1);
    });

    it('should not send email when organizer not found', async () => {
      await useCase.execute({
        user,
        webinarId: webinar.props.id,
      });

      expect(mailer.sentEmails).toHaveLength(0);
    });
  });
});
