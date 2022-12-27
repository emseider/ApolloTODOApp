import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import fs from "fs";
import * as dotenv from 'dotenv';
dotenv.config();

const DATA_FILE = process.env.DATA_FILE;

let todos = [];

// Read the data file and parse the JSON string into an object
try {
  const dataString = fs.readFileSync(DATA_FILE);
  todos = JSON.parse(dataString);
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Add a new todo item
const addTodo = (parent, args, context, info) => {
  const newTodo = {
    id: String(todos.length + 1),
    text: args.text,
    completed: false,
  };
  todos.push(newTodo);
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos));
  return newTodo;
};

// Edit an existing todo item
const editTodo = (parent, {id, text}, context, info) => {
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) {
    throw new Error(`Todo with id ${id} not found`);
  }
  todos[todoIndex].text = text;
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos));
  return todos[todoIndex];
};

// Delete an existing todo item
const deleteTodo = (parent, {id}, context, info) => {
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) {
    throw new Error(`Todo with id ${id} not found`);
  }
  const deletedTodo = todos[todoIndex];
  todos.splice(todoIndex, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos));
  return deletedTodo;
};

const typeDefs = `
  type Todo {
    id: ID!
    text: String!
    completed: Boolean!
  }

  type Query {
    todos: [Todo]!
    todo(id: ID!): Todo
  }

  type Mutation {
    addTodo(text: String!): Todo!
    editTodo(id: ID!, text: String!): Todo!
    deleteTodo(id: ID!): Todo!
  }
`;

const resolvers = {
  Mutation: {
    addTodo,
    editTodo,
    deleteTodo,
  },
  Query: {
    todos: () => todos,
    todo: (_, { id }) => {
      // Find the todo item with the specified id
      const todo = todos.find((t) => t.id === id);
      return todo;
    },
  },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
