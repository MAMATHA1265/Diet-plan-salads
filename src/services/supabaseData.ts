import { supabase } from '../lib/supabase';
import { Appointment, CustomSalad, Ingredient, Plan, Salad } from '../types';
import api from './api';

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `vb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapPlanRow(row: Record<string, any>): Plan {
  return {
    _id: String(row.id),
    name: String(row.name),
    slug: row.slug,
    tagline: String(row.tagline || ''),
    saladsPerDay: Number(row.salads_per_day ?? 1),
    daysPerMonth: Number(row.days_per_month ?? 20),
    monthlyPrice: Number(row.monthly_price ?? 0),
    discountPercent: Number(row.discount_percent ?? 0),
    freeDelivery: Boolean(row.free_delivery),
    features: Array.isArray(row.features) ? row.features : [],
    isActive: row.is_active !== false,
  };
}

function mapSaladRow(row: Record<string, any>): Salad {
  return {
    _id: String(row.id),
    name: String(row.name),
    description: String(row.description || ''),
    price: Number(row.price ?? 0),
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbs ?? 0),
    fats: Number(row.fats ?? 0),
    fiber: Number(row.fiber ?? 0),
    dietaryType: row.dietary_type || 'veg',
    tags: Array.isArray(row.tags) ? row.tags : [],
    ingredientsList: Array.isArray(row.ingredients_list) ? row.ingredients_list : [],
    imageUrl: String(row.image_url || ''),
    isAvailable: row.is_available !== false,
    featured: Boolean(row.featured),
  };
}

function mapIngredientRow(row: Record<string, any>): Ingredient {
  return {
    _id: String(row.id),
    name: String(row.name),
    category: row.category,
    price: Number(row.price ?? 0),
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    dietaryTag: row.dietary_tag || 'vegan',
    isAvailable: row.is_available !== false,
  };
}

function mapCustomSaladRow(row: Record<string, any>): CustomSalad {
  return {
    _id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    baseId: String(row.base_id),
    baseName: String(row.base_name),
    proteinIds: Array.isArray(row.protein_ids) ? row.protein_ids : [],
    proteinNames: Array.isArray(row.protein_names) ? row.protein_names : [],
    toppingIds: Array.isArray(row.topping_ids) ? row.topping_ids : [],
    toppingNames: Array.isArray(row.topping_names) ? row.topping_names : [],
    dressingId: String(row.dressing_id),
    dressingName: String(row.dressing_name),
    specialInstructions: String(row.special_instructions || ''),
    totalPrice: Number(row.total_price ?? 0),
    totalCalories: Number(row.total_calories ?? 0),
    totalProtein: Number(row.total_protein ?? 0),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapAppointmentRow(row: Record<string, any>): Appointment {
  return {
    _id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    memberName: String(row.member_name),
    memberEmail: String(row.member_email),
    phone: String(row.phone),
    goal: String(row.goal || 'Balanced Nutrition'),
    appointmentDate: String(row.appointment_date),
    timeSlot: String(row.time_slot),
    notes: String(row.notes || ''),
    status: row.status || 'Scheduled',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function fetchSalads(): Promise<Salad[]> {
  try {
    const { data, error } = await supabase
      .from('salads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(mapSaladRow);
    }
  } catch {
    // Fall back to API endpoint
  }
  const res = await api.get('/salads');
  return res.data.salads || [];
}

export async function fetchPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(mapPlanRow);
    }
  } catch {
    // Fall back to API endpoint
  }
  const res = await api.get('/plans');
  return res.data.plans || [];
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(mapIngredientRow);
    }
  } catch {
    // Fall back to API endpoint
  }
  const res = await api.get('/ingredients');
  return res.data.ingredients || [];
}

export async function fetchCustomSalads(userId?: string): Promise<CustomSalad[]> {
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('custom_salads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapCustomSaladRow);
      }
    } catch {
      // Fall back to API endpoint
    }
  }
  const res = await api.get('/salads/custom');
  return res.data.customSalads || [];
}

export async function saveCustomSalad(
  userId: string,
  payload: Omit<CustomSalad, '_id' | 'userId' | 'createdAt'>
): Promise<CustomSalad> {
  try {
    const { data, error } = await supabase
      .from('custom_salads')
      .insert({
        id: generateClientId(),
        user_id: userId,
        name: payload.name,
        base_id: payload.baseId,
        base_name: payload.baseName,
        protein_ids: payload.proteinIds,
        protein_names: payload.proteinNames,
        topping_ids: payload.toppingIds,
        topping_names: payload.toppingNames,
        dressing_id: payload.dressingId,
        dressing_name: payload.dressingName,
        special_instructions: payload.specialInstructions,
        total_price: payload.totalPrice,
        total_calories: payload.totalCalories,
        total_protein: payload.totalProtein,
      })
      .select('*')
      .single();

    if (!error && data) {
      return mapCustomSaladRow(data);
    }
  } catch {
    // Fall back to API endpoint
  }

  const res = await api.post('/salads/custom', payload);
  return res.data.customSalad;
}

export async function removeCustomSalad(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('custom_salads').delete().eq('id', id);
    if (!error) return;
  } catch {
    // Fall back to API endpoint
  }
  await api.delete(`/salads/custom/${id}`);
}

export async function fetchAppointments(options: {
  isAdmin?: boolean;
  userId?: string;
  userEmail?: string;
}): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!options.isAdmin && options.userEmail) {
      query = query.ilike('member_email', options.userEmail);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(mapAppointmentRow);
    }
  } catch {
    // Fall back to API endpoint
  }

  if (options.isAdmin || options.userId) {
    const endpoint = options.isAdmin ? '/appointments' : '/appointments/my';
    const res = await api.get(endpoint);
    return res.data.appointments || [];
  }
  return [];
}

export async function createAppointment(payload: {
  userId?: string | null;
  memberName: string;
  memberEmail: string;
  phone: string;
  goal: string;
  appointmentDate: string;
  timeSlot: string;
  notes: string;
}): Promise<{ appointment: Appointment; source: 'supabase' | 'api' }> {
  const rowId = generateClientId();
  const baseRow = {
    id: rowId,
    user_id: payload.userId || null,
    member_name: payload.memberName,
    member_email: payload.memberEmail.toLowerCase(),
    phone: payload.phone,
    goal: payload.goal,
    appointment_date: payload.appointmentDate,
    time_slot: payload.timeSlot,
    notes: payload.notes,
    status: 'Scheduled',
  };

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(baseRow)
      .select('*')
      .single();

    if (!error && data) {
      return { appointment: mapAppointmentRow(data), source: 'supabase' };
    }

    // Retry without user_id if the user record exists only in local session before full DB seed
    if (error?.code === '23503' && baseRow.user_id) {
      const retry = await supabase
        .from('appointments')
        .insert({ ...baseRow, user_id: null })
        .select('*')
        .single();
      if (!retry.error && retry.data) {
        return { appointment: mapAppointmentRow(retry.data), source: 'supabase' };
      }
    }
  } catch {
    // Fall back to API endpoint
  }

  const res = await api.post('/appointments', {
    memberName: payload.memberName,
    memberEmail: payload.memberEmail,
    phone: payload.phone,
    goal: payload.goal,
    appointmentDate: payload.appointmentDate,
    timeSlot: payload.timeSlot,
    notes: payload.notes,
  });
  return { appointment: res.data.appointment, source: 'api' };
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment['status']
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (!error && data) {
      return mapAppointmentRow(data);
    }
  } catch {
    // Fall back to API endpoint
  }
  const res = await api.patch(`/appointments/${id}/status`, { status });
  return res.data.appointment;
}
