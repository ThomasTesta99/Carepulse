"use server"
import { ID, Query, Users } from "node-appwrite";
import { storage, users, BUCKET_ID, databases, DATABASE_ID, PATIENT_COLLECTION_ID, ENDPOINT, PROJECT_ID } from "../appwrite.config";
import { parseStringify } from "../utils";
import {InputFile} from "node-appwrite/file"

export const createUser = async (user: CreateUserParams) => {
    try {
        const newUser = await users.create(
            ID.unique(),
            user.email,
            user.phone, 
            undefined,
            user.name,
        );
        return parseStringify(newUser);
    } catch (error) {
        console.error("Error", error);
        if(error && error?.code === 409){
            const documents = await users.list([
                Query.equal('email', [user.email])
            ])
            return documents?.users[0]
        }
    }
}

export const getUser = async (userId : string) => {
    try {
        const result = await users.list(
            [Query.equal('$id', userId)],
        )
        if(result.total === 0){
            throw new Error(`User with ${userId} not found`);
        }
        const user = result.users[0];

        return parseStringify(user);
    } catch (error) {
        console.log("User with id: " + userId + " could not be found.")
        console.log(error);
    }
}

export const registerPatient = async ({identificationDocument, ...patient}: RegisterUserParams) => {
    try {
        let file;

        if(identificationDocument){
            const inputFile = InputFile.fromBuffer(
                identificationDocument?.get('blobfile') as Blob,
                identificationDocument?.get('fileName') as string,
            )

            file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
        }

        const newPatient = await databases.createDocument(
            DATABASE_ID!,
            PATIENT_COLLECTION_ID!,
            ID.unique(),
            {
                identificationDocumentId: file?.$id || null,
                identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${PROJECT_ID}`,
                ...patient
            }
        )

        return parseStringify(newPatient)
    } catch (error) {
        console.log(error);
    }
}

export const getPatient = async (userId : string) => {
    try {
        const patients = await databases.listDocuments(
            DATABASE_ID!,
            PATIENT_COLLECTION_ID!,
            [
                Query.equal("userId", userId)
            ]
        )


        return parseStringify(patients.documents[0])
    } catch (error) {
        console.log("User with id: " + userId + " could not be found.")
        console.log(error);
    }
}