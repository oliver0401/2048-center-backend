import { AppDataSource } from "../setup/database.setup";
import { EventEntity } from "../entities";

export class EventService {
  private eventRepository = AppDataSource.getRepository(EventEntity);

  /**
   * Calculate points based on event performance
   * Formula: score + (maxTile * 100) - (time / 10) - (swipes * 2)
   * Higher score, higher maxTile = more points
   * Lower time, lower swipes = more points
   */
  private calculatePoints(score: number, maxTile: number, time: number, swipes: number): number {
    const points = score + (maxTile * 100) - Math.floor(time / 10) - (swipes * 2);
    return Math.max(0, points); // Ensure non-negative points
  }

  /**
   * Save or update event record
   * If a record exists for the same event and address, update it
   * Otherwise, create a new record
   */
  async saveOrUpdateEventRecord(eventData: {
    event: string;
    address: string;
    time: number;
    score: number;
    swipes: number;
    maxTile: number;
  }): Promise<EventEntity> {
    // Check if record exists
    const existingRecord = await this.eventRepository.findOne({
      where: {
        event: eventData.event,
        address: eventData.address,
      },
    });

    if (existingRecord) {
      // Update existing record if new score is better
      if (eventData.score > existingRecord.score) {
        existingRecord.time = eventData.time;
        existingRecord.score = eventData.score;
        existingRecord.swipes = eventData.swipes;
        existingRecord.maxTile = eventData.maxTile;
        return await this.eventRepository.save(existingRecord);
      }
      // Return existing record if new score is not better
      return existingRecord;
    }

    // Create new record
    const eventRecord = this.eventRepository.create(eventData);
    return await this.eventRepository.save(eventRecord);
  }

  /**
   * Get leaderboard with pagination
   * Sorted by calculated points (descending)
   * Note: For better performance with large datasets, consider adding a points column to the database
   */
  async getLeaderboard(
    event: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ records: Array<EventEntity & { points: number; rank: number }>; total: number; page: number; limit: number }> {
    // Get all records for the event (we need all to calculate ranks correctly)
    // For production with large datasets, consider adding a computed points column
    const allRecords = await this.eventRepository.find({
      where: { event },
    });

    // Calculate points for each record
    const recordsWithPoints = allRecords.map((record) => ({
      ...record,
      points: this.calculatePoints(record.score, record.maxTile, record.time, record.swipes),
    }));

    // Sort by points (descending), then by score (descending) as tiebreaker
    recordsWithPoints.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // If points are equal, sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by maxTile
      if (b.maxTile !== a.maxTile) {
        return b.maxTile - a.maxTile;
      }
      // If maxTile is equal, sort by time (lower is better)
      return a.time - b.time;
    });

    // Get total count before pagination
    const total = recordsWithPoints.length;

    // Add rank based on sorted position
    const recordsWithRank = recordsWithPoints.map((record, index) => ({
      ...record,
      rank: index + 1,
    }));

    // Apply pagination
    const paginatedRecords = recordsWithRank.slice(offset, offset + limit);

    const page = Math.floor(offset / limit) + 1;

    return {
      records: paginatedRecords,
      total,
      page,
      limit,
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(event: string, address: string): Promise<{ rank: number; points: number; record: EventEntity | null } | null> {
    const userRecord = await this.eventRepository.findOne({
      where: {
        event,
        address,
      },
    });

    if (!userRecord) {
      return null;
    }

    const leaderboard = await this.getLeaderboard(event, 10000, 0); // Get all records
    const userRank = leaderboard.records.findIndex((record) => record.address === address);

    if (userRank === -1) {
      return null;
    }

    const userPoints = this.calculatePoints(
      userRecord.score,
      userRecord.maxTile,
      userRecord.time,
      userRecord.swipes
    );

    return {
      rank: userRank + 1,
      points: userPoints,
      record: userRecord,
    };
  }
}

export const eventService = new EventService();

