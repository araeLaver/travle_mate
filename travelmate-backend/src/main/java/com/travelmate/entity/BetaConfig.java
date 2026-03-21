package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "beta_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BetaConfig {

    @Id
    @Column(name = "config_key", length = 50)
    private String key;

    @Column(name = "config_value", length = 255)
    private String value;

    public static final String BETA_ENABLED = "beta_enabled";
    public static final String MAX_INVITES = "max_invites";
}
