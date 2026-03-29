import { User, Video, Transaction, Subscription, Commission, SocialAccount, UserAvatar, SavedPrompt, ProviderHealth, PromptCache, PricingConfig, GenerationAnalytics } from "@prisma/client";
export declare const mockUser: Partial<User>;
export declare const mockPremiumUser: Partial<User>;
export declare const mockVideo: Partial<Video>;
export declare const mockProcessingVideo: Partial<Video>;
export declare const mockFailedVideo: Partial<Video>;
export declare const mockTransaction: Partial<Transaction>;
export declare const mockPendingTransaction: Partial<Transaction>;
export declare const mockSubscription: Partial<Subscription>;
export declare const mockCommission: Partial<Commission>;
export declare const mockSocialAccount: Partial<SocialAccount>;
export declare const mockAvatar: Partial<UserAvatar>;
export declare const mockSavedPrompt: Partial<SavedPrompt>;
export declare const mockProviderHealth: Partial<ProviderHealth>;
export declare const mockUnhealthyProvider: Partial<ProviderHealth>;
export declare const mockPromptCache: Partial<PromptCache>;
export declare const mockPricingConfig: Partial<PricingConfig>;
export declare const mockAnalytics: Partial<GenerationAnalytics>;
export interface MockBotContext {
    from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
    };
    chat: {
        id: number;
        type: "private" | "group" | "supergroup" | "channel";
    };
    message?: {
        message_id: number;
        text?: string;
        photo?: Array<{
            file_id: string;
            file_unique_id: string;
            file_size: number;
            width: number;
            height: number;
        }>;
        video?: Array<{
            file_id: string;
            file_unique_id: string;
            file_size: number;
            width: number;
            height: number;
            duration: number;
        }>;
    };
    callbackQuery?: {
        id: string;
        data: string;
        message?: {
            message_id: number;
            text?: string;
        };
    };
    session?: {
        state?: string;
        lastActivity?: Date;
        stateData?: Record<string, any>;
        creditBalance?: number;
        tier?: string;
        videoCreation?: any;
        videoCreationNew?: any;
        selectedNiche?: string;
        selectedStyles?: string[];
    };
    reply: jest.Mock;
    editMessageText: jest.Mock;
    editMessageMedia: jest.Mock;
    answerCbQuery: jest.Mock;
    replyWithPhoto: jest.Mock;
    replyWithVideo: jest.Mock;
    replyWithAnimation: jest.Mock;
    replyWithInvoice: jest.Mock;
    deleteMessage: jest.Mock;
    telegram: {
        sendMessage: jest.Mock;
        sendPhoto: jest.Mock;
        sendVideo: jest.Mock;
        sendAnimation: jest.Mock;
        getFileLink: jest.Mock;
        setWebhook: jest.Mock;
        deleteWebhook: jest.Mock;
        setMyCommands: jest.Mock;
        deleteMessage: jest.Mock;
    };
}
export declare function createMockContext(overrides?: Partial<MockBotContext>): MockBotContext;
export declare function createMockCallbackContext(data: string, overrides?: Partial<MockBotContext>): MockBotContext & {
    callbackQuery: {
        id: "test_callback";
        data: any;
        message: {
            message_id: 1;
        };
    };
};
//# sourceMappingURL=index.d.ts.map