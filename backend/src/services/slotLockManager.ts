export interface SlotLock {
  slotIso: string;
  clinicId: string;
  bookedByPhone: string;
  patientName: string;
  bookingId: string;
  lockedAt: Date;
}

/**
 * In-memory Atomic Mutex & Slot Lock Manager.
 * Ensures zero double-bookings when concurrent callers request the exact same slot at the exact same millisecond.
 */
class SlotLockManager {
  private locks: Map<string, SlotLock> = new Map(); // key: `${clinicId}:${slotIso}`
  private mutexLocks: Map<string, Promise<void>> = new Map();

  private getKey(clinicId: string, slotIso: string): string {
    return `${clinicId}:${slotIso}`;
  }

  /**
   * Attempts to atomically lock and reserve a slot for a patient.
   * If slot is already locked/booked, returns false with collision details.
   */
  public async acquireLock(
    clinicId: string,
    slotIso: string,
    patientName: string,
    patientPhone: string,
    bookingId: string
  ): Promise<{ success: boolean; existingLock?: SlotLock }> {
    const key = this.getKey(clinicId, slotIso);

    // Atomic Mutex acquisition for this specific key
    while (this.mutexLocks.has(key)) {
      await this.mutexLocks.get(key);
    }

    let releaseMutex!: () => void;
    const mutexPromise = new Promise<void>((resolve) => {
      releaseMutex = resolve;
    });
    this.mutexLocks.set(key, mutexPromise);

    try {
      if (this.locks.has(key)) {
        // Slot is already locked/taken!
        const existingLock = this.locks.get(key)!;
        return { success: false, existingLock };
      }

      // Lock acquired successfully!
      const newLock: SlotLock = {
        slotIso,
        clinicId,
        bookedByPhone: patientPhone,
        patientName,
        bookingId,
        lockedAt: new Date()
      };
      this.locks.set(key, newLock);
      return { success: true };
    } finally {
      this.mutexLocks.delete(key);
      releaseMutex();
    }
  }

  /**
   * Checks if a slot is currently locked/booked.
   */
  public isLocked(clinicId: string, slotIso: string): boolean {
    const key = this.getKey(clinicId, slotIso);
    return this.locks.has(key);
  }

  /**
   * Releases an acquired slot lock.
   */
  public releaseLock(clinicId: string, slotIso: string): void {
    const key = this.getKey(clinicId, slotIso);
    this.locks.delete(key);
  }

  /**
   * Returns all locked slots for a given clinic.
   */
  public getClinicLocks(clinicId: string): SlotLock[] {
    return Array.from(this.locks.values()).filter((l) => l.clinicId === clinicId);
  }

  /**
   * Clears locks (useful for testing).
   */
  public resetLocks(): void {
    this.locks.clear();
    this.mutexLocks.clear();
  }
}

export const slotLockManager = new SlotLockManager();
