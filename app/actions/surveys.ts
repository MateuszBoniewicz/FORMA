'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface SurveyPublicData {
  token: string;
  trainingDate: string;
  trainingTopic: string | null;
  playerName: string;
  clubId: string;
}

export interface SubmitSurveyPayload {
  token: string;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
}

export interface TrainingSurveyInfo {
  trainingId: string;
  date: string;
  topic: string | null;
  pendingPlayers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
  }>;
}

/**
 * 1. Pobiera dane treningu i listę obecnych zawodników, sprawdzając ważność terminu ankiety
 */
export async function getTrainingSurveySession(trainingId: string): Promise<{
  success: boolean;
  data?: TrainingSurveyInfo;
  isExpired?: boolean;
  error?: string;
}> {
  try {
    const { data: training, error: trErr } = await supabaseAdmin
      .from('trainings')
      .select('id, date, topic, survey_enabled')
      .eq('id', trainingId)
      .single();

    if (trErr || !training) {
      return { success: false, error: 'Nie znaleziono jednostki treningowej.' };
    }

    // 1. Sprawdzenie terminu ważności ankiety dla tej jednostki
    const { data: anySurvey } = await supabaseAdmin
      .from('post_training_surveys')
      .select('expires_at')
      .eq('training_id', trainingId)
      .limit(1)
      .maybeSingle();

    if (anySurvey?.expires_at && new Date(anySurvey.expires_at) < new Date()) {
      return {
        success: false,
        isExpired: true,
        error: 'Czas na przesłanie ankiety dla tego treningu upłynął (link wygasł).',
      };
    }

    const { data: surveys, error: survErr } = await supabaseAdmin
      .from('post_training_surveys')
      .select(`
        player_id,
        is_completed,
        expires_at,
        players!inner ( id, first_name, last_name, jersey_number )
      `)
      .eq('training_id', trainingId)
      .eq('is_completed', false);

    if (survErr) throw survErr;

    // Filtrujemy tylko graczy, których ankiety nie wygasły
    const now = new Date();
    const activeSurveys = (surveys || []).filter((s: any) => {
      if (s.expires_at && new Date(s.expires_at) < now) return false;
      return true;
    });

    const pendingPlayers = activeSurveys
      .map((s: any) => {
        const p = Array.isArray(s.players) ? s.players[0] : s.players;
        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          jerseyNumber: p.jersey_number ?? null,
        };
      })
      .sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99));

    return {
      success: true,
      data: {
        trainingId: training.id,
        date: training.date,
        topic: training.topic,
        pendingPlayers,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Zapisuje odpowiedź z weryfikacją tożsamości oraz twardym sprawdzeniem daty wygaśnięcia
 */
export async function submitGroupSurveyResponse(payload: {
  trainingId: string;
  playerId: string;
  birthYear: number;
  fatigue: number;
  satisfaction: number;
  feedbackNote?: string;
}) {
  try {
    const { trainingId, playerId, birthYear, fatigue, satisfaction, feedbackNote } = payload;

    if (!birthYear || isNaN(birthYear)) {
      return { success: false, error: 'Podaj poprawny rok urodzenia (np. 2008).' };
    }

    if (fatigue < 1 || fatigue > 5 || satisfaction < 1 || satisfaction > 5) {
      return { success: false, error: 'Oceny muszą mieścić się w przedziale 1–5.' };
    }

    // Twarda blokada zapisu po terminie (expires_at) oraz sprawdzenie czy ankieta nie została już wysłana
    const { data: targetSurvey, error: survCheckErr } = await supabaseAdmin
      .from('post_training_surveys')
      .select('id, expires_at, is_completed')
      .eq('training_id', trainingId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (survCheckErr || !targetSurvey) {
      return { success: false, error: 'Nie znaleziono formularza ankiety dla tego zawodnika.' };
    }

    if (targetSurvey.is_completed) {
      return { success: false, error: 'Ta ankieta została już wcześniej wypełniona.' };
    }

    if (targetSurvey.expires_at && new Date(targetSurvey.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Czas na wypełnienie ankiety upłynął (termin ważności wygasł).',
      };
    }

    const { data: player, error: plErr } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (plErr || !player) {
      return { success: false, error: 'Nie znaleziono wybranego zawodnika.' };
    }

    let expectedYear: number | null = null;
    if (player.birth_year) {
      expectedYear = Number(player.birth_year);
    } else if (player.birth_date || player.date_of_birth) {
      const parsedDate = new Date(player.birth_date || player.date_of_birth);
      if (!isNaN(parsedDate.getTime())) {
        expectedYear = parsedDate.getFullYear();
      }
    }

    if (expectedYear !== null && expectedYear !== birthYear) {
      return {
        success: false,
        error: 'Podany rok urodzenia nie zgadza się z danymi zawodnika. Sprawdź, czy na pewno wybrałeś swoje nazwisko.',
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from('post_training_surveys')
      .update({
        fatigue,
        satisfaction,
        feedback_note: feedbackNote?.trim() || null,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('training_id', trainingId)
      .eq('player_id', playerId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}