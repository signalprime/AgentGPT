import axios from "axios";
import SidebarLayout from "../layout/sidebar";
import Combo from "../ui/combox";
import Input from "../ui/input";
import type { Language } from "../utils/languages";
import { languages } from "../utils/languages";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../next-i18next.config.js";
import type { GetStaticProps } from "next";
import {
  FaCheckCircle,
  FaCoins,
  FaExclamationCircle,
  FaGlobe,
  FaKey,
  FaRobot,
  FaSyncAlt,
  FaThermometerFull,
} from "react-icons/fa";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import type { LLMModel } from "../hooks/useModels";
import { useModels } from "../hooks/useModels";
import type { GPTModelNames } from "../types";
import Button from "../ui/button";
import clsx from "clsx";

const SettingsPage = () => {
  const [t] = useTranslation("settings");
  const { settings, updateSettings, updateLangauge } = useSettings();
  const { session } = useAuth();
  const { models, getModel } = useModels();

  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | undefined>(undefined);

  const validateApiKey = async () => {
    try {
      await axios.get("https://api.openai.com/v1/engines", {
        headers: {
          Authorization: `Bearer ${settings.customApiKey}`,
        },
      });

      setIsApiKeyValid(true);
    } catch (error) {
      setIsApiKeyValid(false);
    }
  };

  const disableAdvancedSettings = !session?.user;
  const model = getModel(settings.customModelName) || {
    name: settings.customModelName,
    max_tokens: 2000,
    has_access: true,
  };

  const updateModel = (model: LLMModel) => {
    if (settings.maxTokens > model.max_tokens) {
      updateSettings("maxTokens", model.max_tokens);
    }

    updateSettings("customModelName", model.name as GPTModelNames);
  };

  return (
    <SidebarLayout>
      <div className="grid min-h-screen flex-grow place-items-center p-2 sm:p-10 lg:p-16">
        <div className="background-color-1 border-color-1 m-2 rounded-xl border-2">
          <div className="border-color-1 align flex justify-between border-b-2 p-3 sm:p-5">
            <h1 className="text-color-primary text-3xl font-bold md:text-4xl">⚙ Settings</h1>
          </div>
          <div className="p-3 sm:p-5">
            <div className="flex flex-col gap-3">
              <Combo<Language>
                label="Language"
                value={settings.language}
                valueMapper={(e) => e.name}
                onChange={(e) => {
                  updateLangauge(e).catch(console.error);
                }}
                items={languages}
                icon={<FaGlobe />}
              />
              <div className="flex flex-row items-end gap-2">
                <Input
                  label="API Key"
                  name="api-key"
                  placeholder="sk..."
                  helpText={
                    <span>
                      You can optionally use your own API key here. You can find your API key in
                      your{" "}
                      <a className="link" href="https://platform.openai.com/account/api-keys">
                        OpenAI dashboard.
                      </a>
                    </span>
                  }
                  type="text"
                  value={settings.customApiKey}
                  onChange={(e) => {
                    setIsApiKeyValid(undefined);
                    updateSettings("customApiKey", e.target.value);
                  }}
                  icon={<FaKey />}
                  className="flex-grow-1 mr-2"
                />
                <Button
                  onClick={validateApiKey}
                  className={clsx(
                    "transition-400 h-10 w-10 flex-1 rounded px-2 py-2 text-sm text-white duration-200",
                    isApiKeyValid === undefined && "bg-gray-500 hover:bg-gray-700",
                    isApiKeyValid === true && "bg-green-500 hover:bg-green-700",
                    isApiKeyValid === false && "bg-red-500 hover:bg-red-700"
                  )}
                >
                  {isApiKeyValid === undefined && "Test"}
                  {isApiKeyValid === true && <FaCheckCircle />}
                  {isApiKeyValid === false && <FaExclamationCircle />}
                </Button>
              </div>
            </div>

            {!disableAdvancedSettings && (
              <div className="mt-4 flex flex-col ">
                <h1 className="text-color-primary pb-4 text-xl font-bold">Advanced Settings</h1>
                <div className="flex flex-col gap-3">
                  <Combo<LLMModel>
                    label="Model"
                    value={model}
                    valueMapper={(e) => e.name}
                    onChange={updateModel}
                    items={models}
                    icon={<FaRobot />}
                  />
                  <Input
                    label={t("TEMPERATURE")}
                    value={settings.customTemperature}
                    name="temperature"
                    type="range"
                    onChange={(e) =>
                      updateSettings("customTemperature", parseFloat(e.target.value))
                    }
                    attributes={{
                      min: 0,
                      max: 1,
                      step: 0.01,
                    }}
                    helpText={t("HIGHER_VALUES_MAKE_OUTPUT_MORE_RANDOM")}
                    icon={<FaThermometerFull />}
                    disabled={disableAdvancedSettings}
                  />
                  <Input
                    label={t("LOOP")}
                    value={settings.customMaxLoops}
                    name="loop"
                    type="range"
                    onChange={(e) => updateSettings("customMaxLoops", parseFloat(e.target.value))}
                    attributes={{
                      min: 1,
                      max: 25,
                      step: 1,
                    }}
                    helpText={t("CONTROL_THE_MAXIMUM_NUM_OF_LOOPS")}
                    icon={<FaSyncAlt />}
                    disabled={disableAdvancedSettings}
                  />
                  <Input
                    label={t("TOKENS")}
                    value={settings.maxTokens}
                    name="tokens"
                    type="range"
                    onChange={(e) => updateSettings("maxTokens", parseFloat(e.target.value))}
                    attributes={{
                      min: 200,
                      max: model.max_tokens,
                      step: 100,
                    }}
                    helpText={t("CONTROL_MAXIMUM_OF_TOKENS_DESCRIPTION")}
                    icon={<FaCoins />}
                    disabled={disableAdvancedSettings}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SettingsPage;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
