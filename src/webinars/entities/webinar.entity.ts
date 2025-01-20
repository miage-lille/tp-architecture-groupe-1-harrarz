import { differenceInDays } from 'date-fns';
import { Entity } from 'src/shared/entity';

type WebinarProps = {
  id: string;
  organizerId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  seats: number;
  participants?: string[];
};

export class Webinar extends Entity<WebinarProps> {
  isTooSoon(now: Date): boolean {
    const diff = differenceInDays(this.props.startDate, now);
    return diff < 3;
  }

  hasTooManySeats(): boolean {
    return this.props.seats > 1000;
  }

  hasNotEnoughSeats(): boolean {
    return this.props.seats < 1;
  }

  isOrganizer(userId: string): boolean {
    return this.props.organizerId === userId;
  }

  hasAvailableSeats(): boolean {
    const participants = this.props.participants || [];
    return participants.length < this.props.seats;
  }

  isParticipant(userId: string): boolean {
    const participants = this.props.participants || [];
    return participants.includes(userId);
  }

  addParticipant(userId: string): void {
    const participants = [...(this.props.participants || [])];
    participants.push(userId);
    this.update({ participants });
  }

  getRemainingSeats(): number {
    const participants = this.props.participants || [];
    return this.props.seats - participants.length;
  }
}
