export class DataSubjectFoundation {
  capabilities() {
    return {
      access_request_foundation: true,
      review_request_foundation: true,
      anonymization_future: true,
      deletion_future: true,
      export_future: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const dataSubjectFoundation = new DataSubjectFoundation();
