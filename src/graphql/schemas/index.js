import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum UserRole {
    Admin
    Instrutor
    Aluno
  }

  enum UserStatus {
    Ativo
    Inativo
  }

  type User {
    id: ID!
    documento: String!
    nome_completo: String!
    email: String!
    tipo: UserRole!
    status: UserStatus!
    studentProfile: StudentProfile
    instructorProfile: InstructorProfile
    created_at: String
    updated_at: String
  }

  type StudentProfile {
    height: Float
    weight: Float
    date_of_birth: String
    instructor: User
  }

  type InstructorProfile {
    cref: String!
    specialization: String
    bio: String
  }

  type Exercise {
    id: ID!
    name: String!
    description: String
    general_observation: String
    muscle_category: String
    video_link: String
    created_at: String
    updated_at: String
  }

  type Modifier {
    id: ID!
    name: String!
    description: String
    created_at: String
    updated_at: String
  }

  type WorkoutPlanItem {
    id: ID!
    exercise: Exercise!
    series_count: Int!
    repetitions_expected: String!
    load_suggested: String
    observations: String
    order_index: Int!
    modifiers: [Modifier!]
  }

  type WorkoutPlan {
    id: ID!
    name: String!
    description: String
    instructor: User!
    student: User!
    start_date: String!
    end_date: String!
    items: [WorkoutPlanItem!]
    created_at: String
    updated_at: String
  }

  type Execution {
    id: ID!
    exercise: Exercise!
    series_completed: Int!
    repetitions_completed: String!
    load_used: String!
    observations: String
    modifiers: [Modifier!]
    created_at: String
    updated_at: String
  }

  type Session {
    id: ID!
    student: User!
    workout_plan: WorkoutPlan
    session_date: String!
    observations: String
    executions: [Execution!]
    created_at: String
    updated_at: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input StudentProfileInput {
    height: Float
    weight: Float
    date_of_birth: String
    instructor_id: ID
  }

  input InstructorProfileInput {
    cref: String!
    specialization: String
    bio: String
  }

  input CreateUserInput {
    documento: String!
    nome_completo: String!
    email: String!
    password: String!
    tipo: UserRole!
    status: UserStatus = Ativo
    studentProfile: StudentProfileInput
    instructorProfile: InstructorProfileInput
  }

  input UpdateUserInput {
    documento: String
    nome_completo: String
    email: String
    status: UserStatus
    studentProfile: StudentProfileInput
    instructorProfile: InstructorProfileInput
  }

  input WorkoutPlanItemInput {
    exercise_id: ID!
    series_count: Int!
    repetitions_expected: String!
    load_suggested: String
    observations: String
    order_index: Int!
    modifier_ids: [ID!]
  }

  input CreateWorkoutPlanInput {
    name: String!
    description: String
    instructor_id: ID!
    student_id: ID!
    start_date: String!
    end_date: String!
    items: [WorkoutPlanItemInput!]!
  }

  input UpdateWorkoutPlanInput {
    name: String
    description: String
    instructor_id: ID
    student_id: ID
    start_date: String
    end_date: String
    items: [WorkoutPlanItemInput!]
  }

  input ExecutionInput {
    exercise_id: ID!
    series_completed: Int!
    repetitions_completed: String!
    load_used: String!
    observations: String
    modifier_ids: [ID!]
  }

  input CreateSessionInput {
    student_id: ID!
    workout_plan_id: ID
    session_date: String!
    observations: String
    executions: [ExecutionInput!]!
  }

  input UpdateSessionInput {
    workout_plan_id: ID
    session_date: String
    observations: String
    executions: [ExecutionInput!]
  }

  input CreateExerciseInput {
      name: String!
      description: String
      general_observation: String
      muscle_category: String
      video_link: String
  }

  input UpdateExerciseInput {
      name: String
      description: String
      general_observation: String
      muscle_category: String
      video_link: String
  }

  input CreateModifierInput {
      name: String!
      description: String
  }

  input UpdateModifierInput {
      name: String
      description: String
  }

  type Query {
    # User
    users(role: UserRole, status: UserStatus): [User!]
    user(id: ID!): User

    # Exercise
    exercises: [Exercise!]
    exercise(id: ID!): Exercise

    # Modifier
    modifiers: [Modifier!]
    modifier(id: ID!): Modifier

    # WorkoutPlan
    workoutPlans(studentId: ID, instructorId: ID): [WorkoutPlan!]
    workoutPlan(id: ID!): WorkoutPlan

    # Session
    sessions(studentId: ID, planId: ID): [Session!]
    session(id: ID!): Session
  }

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!

    # User
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Exercise
    createExercise(input: CreateExerciseInput!): Exercise!
    updateExercise(id: ID!, input: UpdateExerciseInput!): Exercise!
    deleteExercise(id: ID!): Boolean!

    # Modifier
    createModifier(input: CreateModifierInput!): Modifier!
    updateModifier(id: ID!, input: UpdateModifierInput!): Modifier!
    deleteModifier(id: ID!): Boolean!

    # WorkoutPlan
    createWorkoutPlan(input: CreateWorkoutPlanInput!): WorkoutPlan!
    updateWorkoutPlan(id: ID!, input: UpdateWorkoutPlanInput!): WorkoutPlan!
    deleteWorkoutPlan(id: ID!): Boolean!

    # Session
    createSession(input: CreateSessionInput!): Session!
    updateSession(id: ID!, input: UpdateSessionInput!): Session!
    deleteSession(id: ID!): Boolean!
  }
`;


