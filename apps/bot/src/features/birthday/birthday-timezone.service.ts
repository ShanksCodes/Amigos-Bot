import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

export interface TimezoneOption {
  label: string;
  value: string;
}

@Injectable()
export class BirthdayTimezoneService {
  
  getRegions(): { label: string; value: string; emoji: string }[] {
    return [
      { label: 'North America', value: 'NA', emoji: '🌎' },
      { label: 'South America', value: 'SA', emoji: '🌎' },
      { label: 'Europe', value: 'EU', emoji: '🌍' },
      { label: 'Asia', value: 'AS', emoji: '🌏' },
      { label: 'Africa', value: 'AF', emoji: '🌍' },
      { label: 'Australia / Pacific', value: 'OC', emoji: '🌏' },
    ];
  }

  getTimezonesForRegion(region: string): TimezoneOption[] {
    switch (region) {
      case 'NA':
        return [
          { label: 'US Eastern', value: 'America/New_York' },
          { label: 'US Central', value: 'America/Chicago' },
          { label: 'US Mountain', value: 'America/Denver' },
          { label: 'US Pacific', value: 'America/Los_Angeles' },
          { label: 'US Alaska', value: 'America/Anchorage' },
          { label: 'US Hawaii', value: 'Pacific/Honolulu' },
          { label: 'Canada Eastern', value: 'America/Toronto' },
          { label: 'Canada Pacific', value: 'America/Vancouver' },
        ];
      case 'SA':
        return [
          { label: 'Brazil (São Paulo)', value: 'America/Sao_Paulo' },
          { label: 'Argentina (Buenos Aires)', value: 'America/Argentina/Buenos_Aires' },
          { label: 'Chile (Santiago)', value: 'America/Santiago' },
          { label: 'Colombia (Bogotá)', value: 'America/Bogota' },
        ];
      case 'EU':
        return [
          { label: 'UK (London)', value: 'Europe/London' },
          { label: 'Central Europe (Paris/Berlin)', value: 'Europe/Paris' },
          { label: 'Eastern Europe (Athens/Kyiv)', value: 'Europe/Athens' },
          { label: 'Moscow', value: 'Europe/Moscow' },
        ];
      case 'AS':
        return [
          { label: 'India', value: 'Asia/Kolkata' },
          { label: 'Japan', value: 'Asia/Tokyo' },
          { label: 'China', value: 'Asia/Shanghai' },
          { label: 'Singapore', value: 'Asia/Singapore' },
          { label: 'UAE (Dubai)', value: 'Asia/Dubai' },
          { label: 'South Korea', value: 'Asia/Seoul' },
        ];
      case 'AF':
        return [
          { label: 'Egypt (Cairo)', value: 'Africa/Cairo' },
          { label: 'South Africa (Johannesburg)', value: 'Africa/Johannesburg' },
          { label: 'Nigeria (Lagos)', value: 'Africa/Lagos' },
          { label: 'Kenya (Nairobi)', value: 'Africa/Nairobi' },
        ];
      case 'OC':
        return [
          { label: 'Australia (Sydney)', value: 'Australia/Sydney' },
          { label: 'Australia (Perth)', value: 'Australia/Perth' },
          { label: 'New Zealand (Auckland)', value: 'Pacific/Auckland' },
        ];
      default:
        return [];
    }
  }

  isValidIana(timezone: string): boolean {
    return DateTime.local({ zone: timezone }).isValid;
  }
}
